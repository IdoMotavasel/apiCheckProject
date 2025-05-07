import "../home.css";
import { useTokenProperty } from "../utils/decodingUtils";

const Home = (): JSX.Element => {
  const username = useTokenProperty("username");

  return (
    <div className="home-container">
      <h1 className="home-username">Welcome, {username}</h1>

      <div className="home-spinner-wrapper">
        <div className="home-spinner">
          <span className="home-spinner-text">CheckAPI</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
