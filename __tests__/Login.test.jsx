jest.mock("firebase/app", () => {
  const mockAuthObj = {
    onAuthStateChanged: jest.fn(),
    signInWithCredential: jest.fn(),
    currentUser: {
      getIdToken: jest.fn(),
    },
  };
  return {
    auth: jest.fn(() => {
      return mockAuthObj;
    }),
    GoogleAuthProvider: jest.fn(() => ({
      credential: jest.fn(),
    })),
    initializeApp: jest.fn(),
  };
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../src/components/Login";
const firebase = require("firebase/app");

describe("Login Component", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should call handleLogin when the button is clicked", async () => {
    const mockOnLoginSuccess = jest.fn();

    const mockAuthInstance = firebase.auth();

    if (!mockAuthInstance) {
      console.error("mockAuthInstance is undefined.");
      return;
    }

    mockAuthInstance.signInWithCredential.mockResolvedValue({
      user: { uid: "userUid" },
    });
    mockAuthInstance.currentUser.getIdToken.mockResolvedValue("userToken");

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);

    const loginButton = screen.getByText("Sign in with Google");
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockAuthInstance.signInWithCredential).toHaveBeenCalled();
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });
});
