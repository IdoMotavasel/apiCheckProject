import './adminHome.css';
import { useTokenProperty } from '../../utils/decodingUtils';
const AdminHome = (): JSX.Element => {
  const username: string = useTokenProperty("username"); 

  return (
    <div className="admin-home">
      <main>
          <h1>Welcome to the Home Page! {username}</h1>
          <p>This is the home page of the application.</p>
      </main>
    </div>
  );
};

export default AdminHome;