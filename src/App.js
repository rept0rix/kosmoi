// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import BlogPost from './BlogPost';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/blog" component={BlogPost} />
        {/* Other routes */}
      </Switch>
    </Router>
  );
}

export default App;