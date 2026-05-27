import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {useEffect, useState} from "react";
import {getCurrentUser, signIn as puterSignIn, signOut as puterSignOut} from "../lib/puter.action";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script src="https://js.puter.com/v2/puter.js"></script>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}


const DEFAULT_AUTH_STATE: AuthState = {
  isSignedIn: false,
  userName: null,
  userId: null,

}
export default function App() {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);
  const [puterReady, setPuterReady] = useState(false);

  useEffect(() => {
    const checkPuter = setInterval(() => {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.puter) {
        console.log("Puter detected");
        setPuterReady(true);
        clearInterval(checkPuter);
      }
    }, 100);
    return () => clearInterval(checkPuter);
  }, []);

  const refreshAuth = async () => {
    console.log("refreshAuth called");

    try {
      const user = await getCurrentUser();
      console.log("User fetched in refreshAuth:", user ? `${user.username} (${user.uuid})` : "null");

      setAuthState({
        isSignedIn: !!user,
        userName: user?.username || null,
        userId: user?.uuid || null,
      });

      return !!user;
    } catch (e) {
      console.error("refreshAuth failed:", e);
      setAuthState(DEFAULT_AUTH_STATE);
      return false;
    }
  }

  useEffect(() => {
    if (puterReady) {
      console.log("Puter ready, triggering initial refreshAuth");
      refreshAuth();
    }
  }, [puterReady]);

  const signIn= async () => {
    try {
      console.log("Calling signIn from puter.action");
      await puterSignIn();
      console.log("signIn call returned, refreshing auth...");
      return await refreshAuth();
    } catch (e) {
      console.error("Sign in failed", e);
      return false;
    }
  }

  const signOut= async () => {
    try {
      console.log("Calling signOut from puter.action");
      await puterSignOut();
      console.log("signOut call returned, refreshing auth...");
      return await refreshAuth();
    } catch (e) {
      console.error("Sign out failed", e);
      return false;
    }
  }

  return (
      <main className="min-h-screen bg-background text-foreground relative z-10" >

        <Outlet
            context={{...authState, refreshAuth, signIn, signOut, puterReady}}
        />
      </main>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
