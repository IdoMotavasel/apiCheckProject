import "../../home.css";
import { useTokenProperty } from '../../utils/decodingUtils';
import TokenWrapper from '../routeHelpers/TokenWrapper';
const AdminHome = (): JSX.Element => {
  const username: string = useTokenProperty("username"); 

  return (
    <TokenWrapper>
      <div className="main-container">
        <div className="centered-content">
          <main className="home-page">
              <h1 className="neon flicker-slow">Welcome {username} !</h1>
          </main>
        </div>
      </div>
    </TokenWrapper>
  );
};

export default AdminHome;