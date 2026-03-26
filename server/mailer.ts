import net from "net";
import tls from "tls";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  requireTls: boolean;
  secure: boolean;
};

type SocketLike = net.Socket | tls.TLSSocket;

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT || "", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.PASSWORD_RESET_EMAIL_FROM?.trim();

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    secure: process.env.SMTP_SECURE === "true",
    requireTls: process.env.SMTP_REQUIRE_TLS !== "false",
  };
}

function encodeBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function renderMessage(config: SmtpConfig, payload: MailPayload) {
  const boundary = `focusfeed-${Date.now().toString(36)}`;

  return [
    `From: FocusFeed <${config.from}>`,
    `To: ${payload.to}`,
    `Subject: ${payload.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    payload.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    payload.html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function onceLine(socket: SocketLike) {
  return new Promise<string>((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(new Error("SMTP connection closed unexpectedly"));
    };

    const onData = (chunk: Buffer | string) => {
      buffer += chunk.toString();
      if (!buffer.includes("\r\n")) {
        return;
      }

      const lines = buffer.split("\r\n").filter(Boolean);
      const last = lines[lines.length - 1];
      if (!last || last.length < 4 || last[3] === "-") {
        return;
      }

      cleanup();
      resolve(buffer);
    };

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
  });
}

async function sendCommand(
  socket: SocketLike,
  command: string,
  allowedCodes: number[],
) {
  socket.write(command);
  const response = await onceLine(socket);
  const code = Number.parseInt(response.slice(0, 3), 10);

  if (!allowedCodes.includes(code)) {
    throw new Error(`SMTP ${code}: ${response.trim()}`);
  }

  return response;
}

function upgradeToTls(socket: net.Socket, host: string) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const secureSocket = tls.connect(
      {
        socket,
        servername: host,
      },
      () => resolve(secureSocket),
    );

    secureSocket.once("error", reject);
  });
}

async function connect(config: SmtpConfig): Promise<SocketLike> {
  if (config.secure) {
    return new Promise<tls.TLSSocket>((resolve, reject) => {
      const socket = tls.connect(
        {
          host: config.host,
          port: config.port,
          servername: config.host,
        },
        () => resolve(socket),
      );

      socket.once("error", reject);
    });
  }

  return new Promise<net.Socket>((resolve, reject) => {
    const socket = net.createConnection(
      {
        host: config.host,
        port: config.port,
      },
      () => resolve(socket),
    );

    socket.once("error", reject);
  });
}

export async function sendTransactionalEmail(payload: MailPayload) {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("SMTP env vars are incomplete.");
  }

  let socket = await connect(config);

  try {
    await onceLine(socket);
    await sendCommand(socket, `EHLO ${config.host}\r\n`, [250]);

    if (!config.secure && config.requireTls) {
      await sendCommand(socket, "STARTTLS\r\n", [220]);
      socket = await upgradeToTls(socket as net.Socket, config.host);
      await sendCommand(socket, `EHLO ${config.host}\r\n`, [250]);
    }

    await sendCommand(socket, "AUTH LOGIN\r\n", [334]);
    await sendCommand(socket, `${encodeBase64(config.user)}\r\n`, [334]);
    await sendCommand(socket, `${encodeBase64(config.pass)}\r\n`, [235]);
    await sendCommand(socket, `MAIL FROM:<${config.from}>\r\n`, [250]);
    await sendCommand(socket, `RCPT TO:<${payload.to}>\r\n`, [250, 251]);
    await sendCommand(socket, "DATA\r\n", [354]);
    await sendCommand(socket, `${renderMessage(config, payload)}\r\n.\r\n`, [250]);
    await sendCommand(socket, "QUIT\r\n", [221]);
  } finally {
    socket.destroy();
  }
}

function wrapEmailHtml(content: string) {
  return `
    <div style="font-family:Arial,sans-serif;background:#0c1324;color:#f8fbff;padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        ${content}
      </div>
    </div>
  `;
}

export async function sendWelcomeEmail(email: string) {
  return sendTransactionalEmail({
    to: email,
    subject: "You’re in. Your next stack is waiting.",
    text:
      "You’re in.\n\nFocusFeed is ready whenever you want a smarter scroll. Pick a lane, stack a few quick hits, and keep the good ones moving.\n\nOne more swipe. One more win.\n\nFocusFeed",
    html: wrapEmailHtml(`
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6fd8ff;">FocusFeed</p>
      <h1 style="margin:0 0 16px;font-size:32px;line-height:1.05;">You’re in. Your next stack is waiting.</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#c7d7ee;">
        FocusFeed is ready whenever you want a smarter scroll.
      </p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#c7d7ee;">
        Pick a lane, stack a few quick hits, and keep the good ones moving.
      </p>
      <p style="margin:20px 0 0;font-size:18px;line-height:1.5;color:#ffffff;">
        One more swipe. One more win.
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const subject =
    process.env.PASSWORD_RESET_EMAIL_SUBJECT?.trim() ||
    "Reset your FocusFeed password";

  return sendTransactionalEmail({
    to: email,
    subject,
    text:
      `Need a clean way back in?\n\nReset your FocusFeed password here:\n${resetUrl}\n\nThis link expires soon. If you didn’t ask for it, you can ignore this email.\n\nFocusFeed`,
    html: wrapEmailHtml(`
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#6fd8ff;">FocusFeed</p>
      <h1 style="margin:0 0 16px;font-size:32px;line-height:1.05;">Get back in and pick up your run.</h1>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#c7d7ee;">
        Tap the button below to reset your password and get back to your next stack.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#3ae3ff;color:#08111f;text-decoration:none;font-weight:700;">
        Reset password
      </a>
      <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#c7d7ee;">
        This link expires soon. If you didn’t ask for it, you can ignore this email.
      </p>
      <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#9ab0cb;">
        ${resetUrl}
      </p>
    `),
  });
}

