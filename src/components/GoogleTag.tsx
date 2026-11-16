import Script from "next/script";

export function GoogleTag() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;
  if (!id) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
