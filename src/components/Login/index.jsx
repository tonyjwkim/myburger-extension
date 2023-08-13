import styled from "styled-components";
import { auth, GoogleAuthProvider } from "../../utils/firebase";

function Login({ onLoginSuccess }) {
  function getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  async function handleLogin() {
    try {
      const token = await getAuthToken();
      const credential = GoogleAuthProvider.credential(null, token);
      const result = await auth.signInWithCredential(credential);

      console.log("User signed in:", result.user);
      onLoginSuccess(result.user);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <LoginContainer>
      <Title>Unlock these features now:</Title>
      <FeatureList>
        <Feature>Save and organize your highlights</Feature>
        <Feature>Dive into Focused Mode</Feature>
        <Feature>Apply custom visual filters</Feature>
      </FeatureList>

      <GoogleLoginButton onClick={handleLogin}>
        Sign in with Google
      </GoogleLoginButton>

      <SignupPrompt>
        No account yet? <SignupLink>Sign up</SignupLink>
      </SignupPrompt>
    </LoginContainer>
  );
}

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f7f7f7;
`;

const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 20px;
  text-align: center;
  color: black;
`;

const FeatureList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin-bottom: 30px;
`;

const Feature = styled.li`
  font-size: 14px;
  margin-bottom: 10px;
  color: black;
  &:last-child {
    margin-bottom: 0;
  }
`;

const GoogleLoginButton = styled.button`
  background-color: #4285f4;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  &:hover {
    background-color: #2a75f3;
  }
`;

const SignupPrompt = styled.p`
  margin-top: 20px;
  font-size: 12px;
  color: black;
`;

const SignupLink = styled.a`
  color: #4285f4;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export default Login;
