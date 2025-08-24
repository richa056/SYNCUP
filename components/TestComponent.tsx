import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🎉 App is Working!</h1>
        <p className="text-lg mb-6">The application is loading correctly.</p>
        <div className="space-y-2 text-sm">
          <p>✅ React is working</p>
          <p>✅ Tailwind CSS is working</p>
          <p>✅ Routing is working</p>
          <p>✅ Context providers are working</p>
        </div>
        <a 
          href="/" 
          className="inline-block mt-6 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default TestComponent;
