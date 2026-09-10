import {
  AppType,
  Provider as GadgetProvider,
  useGadget,
} from "@gadgetinc/react-shopify-app-bridge";
import { useEffect } from "react";
import {
  Link,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from "react-router";
import { api } from "../api";
import { AppBridgeNavigate } from "./AppBridgeNavigate";
import { IndexPage } from "../routes/index";
import "./App.css";

function Error404() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const appURL = process.env.GADGET_PUBLIC_SHOPIFY_APP_URL;

    if (appURL && location.pathname === new URL(appURL).pathname) {
      navigate("/", { replace: true });
    }
  }, [location.pathname]);

  return <div>404 not found</div>;
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
        <Route path="*" element={<Error404 />} />
      </Route>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

function Layout() {
  return (
    <GadgetProvider
      type={AppType.Embedded}
      shopifyApiKey={window.gadgetConfig.apiKeys.shopify}
      api={api}
    >
      <AppBridgeNavigate />
      <AuthenticatedApp />
    </GadgetProvider>
  );
}

function AuthenticatedApp() {
  // we use `isAuthenticated` to render pages once the OAuth flow is complete!
  const { isAuthenticated, loading } = useGadget();
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <s-spinner accessibility-label="Loading" size="large" />
      </div>
    );
  }
  return isAuthenticated ? <EmbeddedApp /> : <UnauthenticatedApp />;
}

/*
NOTE ABOUT TYPES
- There is a known issue with Polaris web component types - https://community.shopify.dev/t/missing-app-bridge-type-declarations-for-s-app-nav/26478
- The `<s-app-nav>` JSX component has broken types when used in React 19 with @shopify/polaris-types v1.0.1
- The actual component works properly as documented - https://shopify.dev/docs/api/app-home/app-bridge-web-components/app-nav
*/

function EmbeddedApp() {
  return (
    <>
      <Outlet />
      {/* @ts-expect-error Property 's-app-nav' does not exist on type 'JSX.IntrinsicElements' */}
      <s-app-nav>
        <s-link href="/">Home</s-link>
        {/* @ts-expect-error Property 's-app-nav' does not exist on type 'JSX.IntrinsicElements' */}
      </s-app-nav>
    </>
  );
}

function UnauthenticatedApp() {
  return (
    <div style={{ padding: "16px", backgroundColor: "#F1F1F1", height: "100vh", width: "100vw" }}>
      <s-page>
        <s-section>
          <s-heading>App must be viewed in the Shopify Admin</s-heading>
          <s-box>
            <s-text>Edit this page: </s-text>
            <s-link href={`/edit/${process.env.GADGET_PUBLIC_APP_ENV}/files/web/components/App.jsx`}>
              web/components/App.jsx
            </s-link>
          </s-box>
        </s-section>
      </s-page>
    </div>
  );
}

export default App;
