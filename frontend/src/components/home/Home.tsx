import './home.css';
import { useTokenProperty } from "../../utils/decodingUtils";
import Spinner from '../spinner/Spinner';

const Home = (): JSX.Element => {
  const username = useTokenProperty("username");

  return (
    <div className="home-container">
      <h1 className="home-username">Welcome, {username}</h1>

      <Spinner text="CheckAPI" size="large" />
    </div>
  );
};

export default Home;
