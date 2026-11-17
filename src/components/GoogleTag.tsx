import Script from "next/script";

export function GoogleTag() {
  const id = "GTM-PNGHNG9N";

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtm.js?id=${id}`} strategy="beforeInteractive" />
      <Script id="google-tag-manager" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date());`}
      </Script>
    </>
  );
}
