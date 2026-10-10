"use client";

import React from "react";

export function WhatsAppButton() {
  const phoneNumber = "13053435371";
  const message = encodeURIComponent(
    "Hi Zachary, I'm exploring Miami luxury real estate on your website and would like to connect."
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <aside
      aria-label="Contact Zachary Akers on WhatsApp"
      className="fixed bottom-6 right-6 z-50"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with Zachary Akers on WhatsApp"
        aria-label="Connect with Zachary Akers on WhatsApp"
        className="group relative flex h-13 w-13 md:h-14 md:w-14 items-center justify-center rounded-full shadow-[0_8px_25px_rgba(37,211,102,0.45)] transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_32px_rgba(37,211,102,0.65)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        style={{
          backgroundColor: "#25D366",
          color: "#ffffff",
          border: "1.5px solid rgba(255, 255, 255, 0.35)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          fill="currentColor"
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <path d="M12.031 2C6.495 2 2 6.49 2 12.022c0 1.765.46 3.488 1.332 5.002L2 22l5.127-1.343a10.007 10.007 0 0 0 4.904 1.277h.004c5.535 0 10.03-4.49 10.03-10.022A10.015 10.015 0 0 0 12.031 2zm0 18.358h-.003a8.318 8.318 0 0 1-4.24-1.16l-.304-.18-3.148.825.84-3.067-.198-.315a8.307 8.307 0 0 1-1.274-4.439c0-4.593 3.738-8.33 8.33-8.33a8.293 8.293 0 0 1 5.889 2.441 8.292 8.292 0 0 1 2.438 5.892c0 4.593-3.738 8.333-8.33 8.333zm4.568-6.236c-.25-.125-1.48-.73-1.71-.813-.23-.083-.396-.125-.563.125-.166.25-.646.813-.792.98-.145.166-.291.187-.541.062a6.85 6.85 0 0 1-2.016-1.243 7.55 7.55 0 0 1-1.393-1.733c-.146-.25-.015-.385.11-.51.112-.112.25-.291.375-.437.125-.146.166-.25.25-.417.083-.166.041-.312-.021-.437-.062-.125-.563-1.354-.77-1.854-.202-.488-.408-.422-.563-.43l-.479-.008c-.166 0-.437.062-.666.312-.23.25-.875.855-.875 2.084 0 1.23.896 2.417 1.02 2.584.125.166 1.762 2.69 4.269 3.771.596.257 1.062.41 1.425.526.6.19 1.144.163 1.575.099.48-.072 1.48-.605 1.688-1.188.208-.584.208-1.084.146-1.188-.063-.105-.229-.167-.479-.292z" />
        </svg>
      </a>
    </aside>
  );
}
