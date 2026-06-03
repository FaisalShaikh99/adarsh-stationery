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
  // 🔑 Smart Extract: '@' ke pehle wale saare letters nikal liye
  const username = email ? email.split('@')[0] : "Team Member";

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Invitation Email for {role}</title>
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
      <Preview>You have been invited to join Adarsh Stationery</Preview>
      
      <Section style={{ padding: '20px', fontFamily: 'Roboto, sans-serif' }}>
        {/* ✅ Ab yahan direct username show hoga */}
        <Row>
          <Heading as="h2">Hello {username},</Heading>
        </Row>
        
        <Row>
          <Text style={{ fontSize: '16px', color: '#333' }}>
            You have been officially invited to join the <strong>Adarsh Stationery</strong> team as an <strong>{role}</strong>.
          </Text>
        </Row>

        <Row>
          {message ? (
            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderLeft: '4px solid #2563eb', margin: '15px 0' }}>
              <Text style={{ fontStyle: 'italic', margin: 0, color: '#4b5563' }}>
                " {message} "
              </Text>
            </div>
          ) : (
            <Text style={{ color: '#555' }}>
              Please click the button below to set up your account and get secure access to the dashboard.
            </Text>
          )}
        </Row>
        
        <Row style={{ marginTop: '20px' }}>
          <Button 
            href={inviteLink} 
            style={{ 
              color: '#fff', 
              backgroundColor: '#2563eb', 
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: 'bold',
              textDecoration: 'none'
            }}
          >
            Accept Invitation & Setup Account
          </Button>
        </Row>

        <Row style={{ marginTop: '30px' }}>
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
            Note: This invitation link is secure and meant only for {email}. If you did not expect this email, please ignore it.
          </Text>
        </Row>
      </Section>
    </Html>
  );
}