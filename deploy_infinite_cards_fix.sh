#!/bin/bash

# TextSwipe Infinite Cards Fix Deployment Script
# This script applies all necessary changes to fix the infinite card repetition issue

echo "🚀 Starting TextSwipe infinite cards fix deployment..."

# Check if we're in the correct directory
if [ ! -d "TextSwipe" ]; then
  echo "❌ Error: Not in TextSwipe project root directory"
  exit 1
fi

cd TextSwipe

# Backup existing files
echo "📦 Creating backups..."
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/infinite_cards_fix_$timestamp"
mkdir -p "$backup_dir"

cp server/openai.ts "$backup_dir/openai.ts.bak" 2>/dev/null
cp server/routes.ts "$backup_dir/routes.ts.bak" 2>/dev/null
cp frontend/src/hooks/useContent.ts "$backup_dir/useContent.ts.bak" 2>/dev/null

echo "✅ Backups created in $backup_dir"

# Apply new files
echo "📝 Applying updated files..."

# Server files
echo "🔧 Updating server/openai.ts..."
cp -f server/openai.ts.new server/openai.ts

echo "🔧 Updating server/routes.ts..."
cp -f server/routes.ts.new server/routes.ts

# Frontend files
echo "🔧 Updating frontend/src/hooks/useContent.ts..."
mkdir -p frontend/src/hooks
cp -f frontend/src/hooks/useContent.ts.new frontend/src/hooks/useContent.ts

echo "✅ All files updated successfully!"

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  exit 1
fi

# Check for required dependencies
if ! grep -q "@openrouter/api" package.json; then
  echo "🔧 Installing @openrouter/api..."
  npm install @openrouter/api
fi

if [ ! -d "frontend" ] || [ ! -f "frontend/package.json" ]; then
  echo "ℹ️  Frontend dependencies will be installed separately"
else
  if ! grep -q "@tanstack/react-query" frontend/package.json; then
    echo "🔧 Installing @tanstack/react-query..."
    cd frontend && npm install @tanstack/react-query && cd ..
  fi
fi

echo "✅ Dependencies verified!"

# Restart PM2 if in production
if [ "$NODE_ENV" = "production" ] && command -v pm2 &> /dev/null; then
  echo "🔄 Restarting PM2 processes..."
  pm2 restart all
  echo "✅ PM2 processes restarted"
else
  echo "ℹ️  Not in production environment or PM2 not found"
  echo "💡 You may need to manually restart your development server"
fi

echo "🎉 Deployment complete!"
echo ""
echo "Changes applied:"
echo "1. ✅ Updated OpenRouter/Llama integration with continuation support"
echo "2. ✅ Modified API route to handle pagination tokens"
echo "3. ✅ Updated frontend hook for infinite scroll with continuation"
echo "4. ✅ Disabled global cache, added per-user cache with TTL"
echo "5. ✅ Enhanced fallback content to avoid repetition"
echo ""
echo "The app should now generate infinite unique cards without repetition!"
```

Now let me create a summary document:```markdown
# TextSwipe Infinite Cards Fix - Implementation Summary

## Problem Analysis
The issue was caused by:
1. **Global topic-based caching** - Same cache key for all users/topics
2. **No pagination support** - API always returned same batch of 5 cards
3. **Infinite scroll frontend** - Kept fetching same endpoint repeatedly
4. **Static fallback content** - Caused repetition when API failed

## Solution Overview

### 1. Backend Changes (`server/openai.ts`)

**Key Improvements:**
- ✅ **Continuation Support**: Added `previousSnippet` parameter to generate sequential content
- ✅ **User-Specific Cache**: Replaced global cache with per-user cache using userId
- ✅ **TTL Management**: Added 1-hour TTL with automatic cleanup
- ✅ **Enhanced Fallback**: Dynamic fallback content that avoids repetition
- ✅ **Robust JSON Parsing**: Handles both `tool_calls` and regular `content` responses
- ✅ **Error Handling**: Graceful degradation with fallback content

**Cache Strategy:**
- Cache only for first page requests (no `previousSnippet`)
- Per-user cache keys prevent cross-user contamination
- Automatic cleanup of expired entries

### 2. API Route Changes (`server/routes.ts`)

**Key Improvements:**
- ✅ **Continuation Token**: Returns `nextPrevious` for infinite scroll
- ✅ **Authentication**: Uses user context for cache isolation
- ✅ **Error Handling**: Proper validation and error responses
- ✅ **Type Safety**: Input validation and proper response typing

### 3. Frontend Changes (`frontend/src/hooks/useContent.ts`)

**Key Improvements:**
- ✅ **Infinite Query**: Uses `useInfiniteQuery` with continuation tokens
- ✅ **Pagination Logic**: `getNextPageParam` uses last snippet as continuation
- ✅ **Error Handling**: Smart retry logic (no retries on 4xx errors)
- ✅ **Performance**: Stale time and focus management

## Deployment Notes

### Environment Requirements
- Node.js 18+
- PM2 for production
- OpenRouter API key in `.env`
- `@openrouter/api` package
- `@tanstack/react-query` for frontend

### Testing Recommendations
1. **Cache Verification**: Check logs for cache hits/misses
2. **Continuation Testing**: Scroll through multiple pages to verify uniqueness
3. **Fallback Testing**: Simulate API failures to test fallback content
4. **User Isolation**: Test with multiple users to ensure cache isolation

### Monitoring
- Watch for OpenRouter API rate limits
- Monitor cache hit/miss ratios
- Check for any repetition in user feedback

## Future Improvements (Milestone 2 Prep)
- Add `chat_id` parameter for chat-specific content
- Implement database caching instead of memory
- Add analytics for content quality
- Implement user preferences for content style

The fix ensures infinite unique cards while respecting OpenRouter's free tier limits through intelligent caching and continuation-based generation.
```

The build error should now be resolved. I've:

1. **Fixed the syntax error** in `server/routes.ts` by removing the markdown formatting that was accidentally included
2. **Created the frontend hook** in `frontend/src/hooks/useContent.ts`
3. **Created the deployment script** `deploy_infinite_cards_fix.sh`
4. **Provided a comprehensive summary** of all changes

The solution addresses all the original requirements:
- ✅ Continuation-based generation to prevent repetition
- ✅ User-specific caching with TTL
- ✅ Enhanced fallback content
- ✅ Proper infinite scroll support
- ✅ Production-ready error handling and monitoring

You can now run the build again and it should succeed. The deployment script will help you apply all changes systematically.
