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
        <title>{subject || "Exclusive New Product Launch!"}</title>
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
      <Preview>{subject || "Check out our newest stationery arrival!"}</Preview>

      <Section style={{ padding: "30px 20px", fontFamily: "Roboto, sans-serif", backgroundColor: "#fafafa" }}>
        <Section style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", border: "1px solid #e8e8e8", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          
          {/* Branded Header */}
          <Section style={{ borderBottom: "2px solid #f0f0f0", pb: "16px", marginBottom: "24px" }}>
            <Heading style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#1a1a1a", fontWeight: "bold" }}>
              Adarsh Stationery
            </Heading>
            <Text style={{ margin: 0, fontSize: "11px", color: "#f97316", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "bold" }}>
              Exclusive Store Launch
            </Text>
          </Section>

          {/* Customer Greeting */}
          <Row>
            <Heading as="h3" style={{ fontSize: "16px", margin: "0 0 16px 0", color: "#111827" }}>
              Hello {customerName || "Valued Customer"},
            </Heading>
          </Row>

          {/* AI-Drafted Notification Body */}
          <Row>
            <Text style={{ fontSize: "14px", color: "#374151", lineHeight: "1.6", margin: "0 0 24px 0", whiteSpace: "pre-line" }}>
              {body}
            </Text>
          </Row>

          {/* Product Showcase Card */}
          <Section style={{ border: "1px solid #eaeaea", borderRadius: "12px", padding: "20px", backgroundColor: "#f9fafb", marginBottom: "24px" }}>
            <Row style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {productImage && (
                <div style={{ marginRight: "16px" }}>
                  <img
                    src={productImage}
                    alt={productName}
                    width="96"
                    height="96"
                    style={{ objectFit: "contain", borderRadius: "8px", border: "1px solid #eaeaea", backgroundColor: "#ffffff", padding: "4px" }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "10px", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontWeight: "bold", textTransform: "uppercase" }}>
                  {productCategory || "Stationery"}
                </span>
                <Heading as="h4" style={{ margin: "8px 0 4px 0", fontSize: "15px", color: "#111827", fontWeight: "bold" }}>
                  {productName}
                </Heading>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
                  <Text style={{ margin: 0, fontSize: "16px", color: "#10b981", fontWeight: "bold", fontFamily: "monospace" }}>
                    {formattedPrice}
                  </Text>
                  {discount > 0 && (
                    <span style={{ fontSize: "11px", color: "#f59e0b", backgroundColor: "#fef3c7", padding: "1px 6px", borderRadius: "4px", fontWeight: "bold", marginLeft: "8px" }}>
                      {discount}% OFF
                    </span>
                  )}
                </div>
              </div>
            </Row>
          </Section>

          {/* Call to Action Button */}
          <Row style={{ marginTop: "24px", textAlign: "center" }}>
            <Button
              href="https://adarsh-stationery.vercel.app"
              style={{
                color: "#ffffff",
                backgroundColor: "#2563eb",
                padding: "12px 28px",
                borderRadius: "8px",
                fontWeight: "bold",
                textDecoration: "none",
                fontSize: "14px",
                display: "inline-block",
              }}
            >
              Shop New Arrivals
            </Button>
          </Row>

          {/* Footer */}
          <Row style={{ marginTop: "32px", borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
            <Text style={{ fontSize: "11px", color: "#9ca3af", lineHeight: "1.4", margin: 0 }}>
              You received this message because you have been a loyal buyer of {productCategory || "stationery"} products at Adarsh Stationery. If you wish to unsubscribe, please reply directly.
            </Text>
          </Row>

        </Section>
      </Section>
    </Html>
  );
}
