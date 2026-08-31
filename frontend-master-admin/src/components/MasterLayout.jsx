import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MasterLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MasterLayout;
