import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignIn } from "@clerk/clerk-react";

const SignInCallback = () => {
  const { isLoaded, signIn } = useSignIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && signIn) {
      navigate("/dashboard"); // Redirect after sign-in
    }
  }, [isLoaded, signIn, navigate]);

  return <p>Signing in...</p>;
};

export default SignInCallback;
