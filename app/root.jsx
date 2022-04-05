import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import windi from "./styles/windi.css";

export const links = () => {
  return [{ rel: "stylesheet", href: windi }]
}

export const meta = () => ({
  charset: "utf-8",
  title: "Smart Greenhouse",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
