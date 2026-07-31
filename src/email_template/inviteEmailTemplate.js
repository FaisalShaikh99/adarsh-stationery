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
} from '@react-email/components';

export default function InviteEmail({ email, role, inviteLink, message }) {
  const username = email ? email.split('@')[0] : "Team Member";
  const displayRole = role ? role.toUpperCase() : "TEAM MEMBER";

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Team Invitation for {displayRole} - Adarsh Stationery</title>
        <Font
          fontFamily="Roboto"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>You have been invited to join the Adarsh Stationery Admin Team</Preview>
      
      <Section style={{ backgroundColor: '#F8F5FB', padding: '40px 15px', fontFamily: 'Roboto, sans-serif' }}>
        <Section style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #E9D8F4', overflow: 'hidden', boxShadow: '0 8px 30px rgba(74, 5, 109, 0.08)' }}>
          
          {/* Header Banner with Brand Amethyst Gradient & Official Logo */}
          <div style={{ backgroundColor: '#4A056D', backgroundImage: 'linear-gradient(135deg, #4A056D 0%, #7E22CE 100%)', padding: '36px 28px', textAlign: 'center' }}>
            <img
              src="https://adarsh-stationery.vercel.app/logo.png"
              alt="Adarsh Stationery Logo"
              width="64"
              height="64"
              style={{
                display: 'block',
                margin: '0 auto 14px auto',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                padding: '6px',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }}
            />
            <div style={{ display: 'inline-block', padding: '5px 14px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.25)', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#F3E8FF', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Official Admin Portal Invite
              </span>
            </div>
            <Heading as="h1" style={{ margin: 0, fontSize: '24px', color: '#ffffff', fontWeight: '900', letterSpacing: '-0.5px' }}>
              Adarsh Stationery Mart
            </Heading>
          </div>

          {/* Main Body Container */}
          <div style={{ padding: '36px 28px' }}>
            <Text style={{ fontSize: '18px', color: '#2D0343', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              Hello {username},
            </Text>
            
            <Text style={{ fontSize: '15px', color: '#4B5563', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              You have been officially invited to join the <strong style={{ color: '#4A056D' }}>Adarsh Stationery</strong> administration team with <strong style={{ color: '#7E22CE' }}>{displayRole}</strong> privileges.
            </Text>

            {/* Custom Invitation Message / AI Note */}
            {message && (
              <div style={{ backgroundColor: '#F9F5FC', border: '1px solid #E9D8F4', borderLeft: '4px solid #7E22CE', borderRadius: '12px', padding: '16px 20px', margin: '0 0 28px 0' }}>
                <Text style={{ fontSize: '11px', color: '#7E22CE', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                  Invitation Note
                </Text>
                <Text style={{ fontStyle: 'italic', fontSize: '14px', color: '#3B0764', margin: 0, lineHeight: '1.5' }}>
                  &ldquo;{message}&rdquo;
                </Text>
              </div>
            )}

            {/* Role Access Callout Pill */}
            <div style={{ backgroundColor: '#F5EDFA', borderRadius: '14px', padding: '16px', border: '1px solid #E9D8F4', textAlign: 'center', margin: '0 0 28px 0' }}>
              <span style={{ fontSize: '12px', color: '#6B21A8', fontWeight: '600' }}>Assigned System Access: </span>
              <span style={{ fontSize: '12px', color: '#ffffff', backgroundColor: '#7E22CE', padding: '4px 14px', borderRadius: '20px', fontWeight: 'bold', textTransform: 'uppercase', marginLeft: '6px', display: 'inline-block' }}>
                {displayRole}
              </span>
            </div>

            {/* Call to Action Button */}
            <div style={{ textAlign: 'center', margin: '32px 0 20px 0' }}>
              <Button
                href={inviteLink}
                style={{
                  color: '#ffffff',
                  backgroundColor: '#4A056D',
                  backgroundImage: 'linear-gradient(135deg, #4A056D 0%, #7E22CE 100%)',
                  padding: '14px 32px',
                  borderRadius: '14px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  boxShadow: '0 4px 14px rgba(126, 34, 206, 0.3)',
                }}
              >
                Accept Invitation & Setup Account →
              </Button>
            </div>

            {/* Link Fallback */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #F3E8FF', textAlign: 'center' }}>
              <Text style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 6px 0' }}>
                Having trouble with the button? Copy and paste this link into your browser:
              </Text>
              <Text style={{ fontSize: '11px', color: '#7E22CE', wordBreak: 'break-all', fontFamily: 'monospace', margin: 0 }}>
                {inviteLink}
              </Text>
            </div>

            {/* Footer Disclaimer */}
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #E9D8F4', textAlign: 'center' }}>
              <Text style={{ fontSize: '11px', color: '#8A6B9B', lineHeight: '1.5', margin: 0 }}>
                Note: This invitation link is secure and restricted exclusively to <strong>{email}</strong>. Valid for 24 hours.
              </Text>
              <Text style={{ fontSize: '11px', color: '#A88DBB', margin: '8px 0 0 0' }}>
                © {new Date().getFullYear()} Adarsh Stationery Mart. All rights reserved.
              </Text>
            </div>

          </div>
        </Section>
      </Section>
    </Html>
  );
}