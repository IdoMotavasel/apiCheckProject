import { UnControlled as CodeMirror } from 'react-codemirror2';
import { useState} from 'react';
import 'codemirror/lib/codemirror.css'; // CSS for the editor styling
import 'codemirror/mode/javascript/javascript'; // JavaScript syntax highlighting mode
import './checkCode.css';
import 'codemirror/theme/dracula.css';
import axios from 'axios';
import TokenWrapper from '../routeHelpers/TokenWrapper';
import { useToken, useTokenProperty } from '../../utils/decodingUtils';

const CheckCode = () => {
  const [validityCheck, setValidityCheck] = useState<string>('');
  const [dockerfileCode, setDockerfileCode] = useState<string>('');
  const [apiCode, setApiCode] = useState<string>('');
  const [packageJsonCode, setpackageJsonCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const accessToken: string = useToken("access")!;
  const userId: string = useTokenProperty("userId");

  const handleCheckApi = async () => {
    if (!dockerfileCode || !apiCode || !packageJsonCode || !description) {
      setError('All fields must be filled!');
      return;
    }
    setError('');
    try{
      console.log('Dockerfile Code:', dockerfileCode);
      console.log('API Code:', apiCode);
      console.log('Package JSON Code:', packageJsonCode);
      console.log('Description:', description);
      const requestBody = {
        description,
        dockerfileCode,
        apiCode,
        packageJsonCode,
      };
      console.log('Request Body:', requestBody);
      const response = await axios.post(`http://localhost:3000/checkApi/${userId}`, {description,dockerfileCode,apiCode,packageJsonCode},
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json',}
        },
      );
      if(response.status === 200){
        console.log('validity set to:', response.data.validityCheck);
        setValidityCheck(response.data.validityCheck);
      } else {
        setValidityCheck('Error occurred');
      }
    }catch(error:any){
      console.error(error);
      setValidityCheck('Error occurred');
    }
  };
  return (
    <div className="check-code-container">
      <h1>Check Code</h1>
      <p>Enter you API code here</p>

      <div className="code-area-container">
        <div className="side-textarea">
          <h3>Dockerfile</h3>
          <CodeMirror
            className="code-textarea"
            value={dockerfileCode}
            options={{
              mode: 'javascript',
              lineNumbers: true,
              theme: 'dracula',
            }}
            onChange={(editor,data,value) => {setDockerfileCode(value)}}
          />
        </div>

        <div className="main-textarea-container">
          <CodeMirror
            className="code-textarea large"
            value={apiCode}
            options={{
              mode: 'javascript',
              lineNumbers: true,
              theme: 'dracula',
            }}
            onChange={(editor,data,value) => setApiCode(value)}
          />
          <textarea
            className="description-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description of your API"
          />
          <TokenWrapper>
            <button className="check-api-button" onClick={handleCheckApi}>CHECK API</button>
          </TokenWrapper>
        </div>

        <div className="side-textarea">
          <h3>package-json</h3>
          <CodeMirror
            className="code-textarea"
            value={packageJsonCode}
            options={{
              mode: 'javascript',
              lineNumbers: true,
              theme: 'dracula'
            }}
            onChange={(editor,data,value) => setpackageJsonCode(value)}
          />
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      {validityCheck && <p>API Validity: {validityCheck}</p>}
    </div>
  );
};

export default CheckCode;