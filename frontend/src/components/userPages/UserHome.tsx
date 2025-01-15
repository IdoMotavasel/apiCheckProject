import {useTokenProperty } from '../../utils/decodingUtils';
import './userHome.css';

const UserHome = ():JSX.Element => {
  const username = useTokenProperty("username");
  return (
    <div className="user-home">
      <main>
        <h1>Welcome to the Home Page! {username}</h1>
        <p>This is the home page of the application.</p>
      </main>
    </div>
  );
};

export default UserHome;