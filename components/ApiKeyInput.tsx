import React, { useState, useEffect } from 'react';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
  hasKey: boolean;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit, hasKey }) => {
  const [key, setKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      onKeySubmit(storedKey);
      setKey(storedKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      localStorage.setItem('openai_api_key', key.trim());
      onKeySubmit(key.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem('openai_api_key');
    setKey('');
    onKeySubmit('');
  };

  return (
    <div className="bg-white p-4 shadow-sm border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
           <h1 className="text-xl font-bold text-gray-800">Founder Problem Analyst</h1>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!hasKey ? (
            <form onSubmit={handleSubmit} className="flex gap-2 w-full">
              <input
                type={isVisible ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter OpenAI API Key"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="text-gray-500 hover:text-gray-700 px-2"
              >
                {isVisible ? 'Hide' : 'Show'}
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
              >
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                API Key Active
              </span>
              <button
                onClick={handleClear}
                className="text-gray-500 text-sm hover:text-red-600 underline"
              >
                Change Key
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-2 text-xs text-gray-500">
        Your API key is stored locally in your browser and sent directly to Google.
      </div>
    </div>
  );
};

export default ApiKeyInput;
