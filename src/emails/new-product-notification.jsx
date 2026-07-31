import {
  Html,
  Head,
  Font,
  Preview,
  Heading,
  Row,
  Section,
  Text,
  Button,
} from "@react-email/components";

export default function NewProductNotification({
  customerName,
  subject,
  body,
  productName,
  productImage,
  productCategory,
  sellingPrice,
  discount,
}) {
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(sellingPrice || 0);

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>{subject || "Exclusive Arrival - Adarsh Stationery"}</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{subject || "Check out our newest stationery arrival at Adarsh Stationery!"}</Preview>

      <Section style={{ backgroundColor: "#F8F5FB", padding: "40px 15px", fontFamily: "Roboto, sans-serif" }}>
        <Section style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #E9D8F4", overflow: "hidden", boxShadow: "0 8px 30px rgba(74, 5, 109, 0.08)" }}>
          
          {/* Branded Amethyst Header with Official Logo */}
          <div style={{ backgroundColor: "#4A056D", backgroundImage: "linear-gradient(135deg, #4A056D 0%, #7E22CE 100%)", padding: "36px 28px", textAlign: "center" }}>
            <img
              src="https://adarsh-stationery.vercel.app/logo.png"
              alt="Adarsh Stationery Logo"
              width="64"
              height="64"
              style={{
                display: "block",
                margin: "0 auto 14px auto",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                padding: "6px",
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
                border: "2px solid rgba(255, 255, 255, 0.4)"
              }}
            />
            <div style={{ display: "inline-block", padding: "5px 14px", backgroundColor: "rgba(255, 255, 255, 0.15)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.25)", marginBottom: "10px" }}>
              <span style={{ fontSize: "11px", color: "#F3E8FF", letterSpacing: "2px", fontWeight: "bold", textTransform: "uppercase" }}>
                Exclusive Store Announcement
              </span>
            </div>
            <Heading as="h1" style={{ margin: 0, fontSize: "24px", color: "#ffffff", fontWeight: "900", letterSpacing: "-0.5px" }}>
              Adarsh Stationery Mart
            </Heading>
          </div>

          <div style={{ padding: "36px 28px" }}>
            {customerName && (
              <Text style={{ fontSize: "18px", color: "#2D0343", fontWeight: "bold", margin: "0 0 16px 0" }}>
                Hello {customerName},
              </Text>
            )}

            {/* Notification Body Content */}
            <Text style={{ fontSize: "14px", color: "#4B5563", lineHeight: "1.7", margin: "0 0 24px 0", whiteSpace: "pre-line" }}>
              {body}
            </Text>

            {/* Product Showcase Card */}
            <div style={{ border: "1px solid #E9D8F4", borderRadius: "16px", padding: "20px", backgroundColor: "#F9F5FC", marginBottom: "28px" }}>
              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                <tr>
                  {productImage && (
                    <td width="100" style={{ verticalAlign: "top", paddingRight: "16px" }}>
                      <img
                        src={productImage}
                        alt={productName || "Product"}
                        width="90"
                        height="90"
                        style={{ objectFit: "contain", borderRadius: "12px", border: "1px solid #E9D8F4", backgroundColor: "#ffffff", padding: "6px" }}
                      />
                    </td>
                  )}
                  <td style={{ verticalAlign: "top" }}>
                    <span style={{ fontSize: "10px", backgroundColor: "#F3E8FF", color: "#7E22CE", padding: "3px 10px", borderRadius: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", border: "1px solid #E9D8F4" }}>
                      {productCategory || "Stationery"}
                    </span>
                    <Heading as="h3" style={{ margin: "8px 0 6px 0", fontSize: "16px", color: "#2D0343", fontWeight: "bold", lineHeight: "1.3" }}>
                      {productName}
                    </Heading>
                    <div style={{ marginTop: "8px" }}>
                      <span style={{ fontSize: "18px", color: "#4A056D", fontWeight: "900", fontFamily: "monospace" }}>
                        {formattedPrice}
                      </span>
                      {discount > 0 && (
                        <span style={{ fontSize: "11px", color: "#B45309", backgroundColor: "#FEF3C7", padding: "2px 8px", borderRadius: "8px", fontWeight: "bold", marginLeft: "10px", border: "1px solid #FDE68A" }}>
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            {/* CTA Button */}
            <div style={{ textAlign: "center", margin: "32px 0 20px 0" }}>
              <Button
                href="https://adarsh-stationery.vercel.app"
                style={{
                  color: "#ffffff",
                  backgroundColor: "#4A056D",
                  backgroundImage: "linear-gradient(135deg, #4A056D 0%, #7E22CE 100%)",
                  padding: "14px 32px",
                  borderRadius: "14px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 4px 14px rgba(126, 34, 206, 0.3)",
                }}
              >
                Explore & Shop Now →
              </Button>
            </div>

            {/* Footer Disclaimer */}
            <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid #E9D8F4", textAlign: "center" }}>
              <Text style={{ fontSize: "11px", color: "#8A6B9B", lineHeight: "1.5", margin: 0 }}>
                You received this announcement from Adarsh Stationery Mart based on your buyer preferences.
              </Text>
              <Text style={{ fontSize: "11px", color: "#A88DBB", margin: "8px 0 0 0" }}>
                © {new Date().getFullYear()} Adarsh Stationery Mart. All rights reserved.
              </Text>
            </div>

          </div>
        </Section>
      </Section>
    </Html>
  );
}
