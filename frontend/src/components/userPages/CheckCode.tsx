import { UnControlled as CodeMirror } from 'react-codemirror2';
import { useState, useEffect} from 'react';
import 'codemirror/lib/codemirror.css'; // CSS for the editor styling
import 'codemirror/mode/javascript/javascript'; // JavaScript syntax highlighting mode
import './checkCode.css';
import 'codemirror/theme/yonce.css';
import axios from 'axios';
import { useToken, useTokenProperty } from '../../utils/decodingUtils';

const CheckCode = () => {
  const [validityCheck, setValidityCheck] = useState<string>('');
  const [apiCode, setApiCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('javascript');
  const [error, setError] = useState<string>('');
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const accessToken: string = useToken("access")!;
  const userId: string = useTokenProperty("userId");

  useEffect(() => {
    if (showPopup) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    // Clean up in case component unmounts while popup is open
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showPopup]);

  const handleCheckApi = async () => {
    if (!apiCode || !description || !name) {
      setError('All fields must be filled!');
      return;
    }
    setError('');
    try{
      console.log('API Code:', apiCode);
      console.log('name:', name);
      console.log('Description:', description);
      const requestBody = {
        description,
        apiCode,
        name,
      };
      console.log('Request Body:', requestBody);
      const response = await axios.post(`http://localhost:3000/user/checkApi/${userId}`, {description, apiCode,name},
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json',}
        },
      );
      if(response.status === 200){
        console.log('validity set to:', response.data.validityCheck);
        setValidityCheck(response.data.validityCheck);
        setShowPopup(true);
      } else {
        setValidityCheck('Error occurred');
        setShowPopup(true);
      }
    }catch(error:any){
      console.error(error);
      setValidityCheck('Error occurred');
      setShowPopup(true);
    }
  };

  const handleClearCode = () => {
    setApiCode('');
    setDescription('');
    setName('');
  };

  return (
      <div className="main-container">
        <div className="check-code-container">
          <h1 className="check-code-title">Check Code</h1>
          <p className="check-code-description">Enter you API code here</p>

          <div className="check-code-language-selector">
            <label htmlFor="language">Language:</label>
            <select
              id="language"
              className="check-code-language-dropdown"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'javascript' | 'typescript')}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          <div className="check-code-area-container">
            <div className="check-code-section">
              <h3 className="check-code-section-title">Main API Code</h3>
              <CodeMirror
                className="check-code-textarea"
                value={apiCode}
                options={{
                  mode: language === 'typescript' ? 'text/typescript' : 'javascript',
                  lineNumbers: true,
                  theme: 'yonce',
                }}
                onChange={(editor,data,value) => {setApiCode(value)}}
              />
            </div>

            <textarea
              className="check-code-description-textarea"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a Name for the API"
            />

            <textarea
              className="check-code-description-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description of your API"
            />
              <button className="check-code-button" onClick={handleCheckApi}>CHECK API</button>
          </div>

          {error && <p className="check-code-error-message">{error}</p>}

          {showPopup && (
            <div className={`check-code-popup-container ${validityCheck === 'valid' ? 'check-code-popup-valid' : 'check-code-popup-invalid'}`}>
              <p className="check-code-popup-message">
                {validityCheck === 'valid' ? 'Valid\nCode sent to admin for final check.' : 'Invalid\nFix your code.'}
              </p>
              <button className="check-code-popup-close" onClick={() => setShowPopup(false)}>Close</button>
            </div>
          )}

          <button className="check-code-clear-button" onClick={handleClearCode}>Clear Code</button>
        </div>
      </div>
  );
};

export default CheckCode;