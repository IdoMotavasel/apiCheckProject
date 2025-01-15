import axios from "axios";
import { clearTokens } from '../store/authSlice';
import { LOGOUT_URL } from '../urls';

export const logoutUser = async (dispatch: any, accessToken: string | null, refreshToken: string | null): Promise<void> => {
  if (accessToken && refreshToken) {
    try {
      const response = await axios.post(
        LOGOUT_URL,
        { refreshToken }, // Send the refresh token to blacklist
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include the access token in the Authorization header
          },
        }
      );

      if (response.status === 200) {
        // Clear tokens if logout is successful
        dispatch(clearTokens());
      }
    } catch (error) {
      console.error("Error during logout:", error); // Handle any errors during the logout process
    }
  } else {
    console.error("Tokens are missing");
  }
};