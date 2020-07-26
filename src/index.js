import React from 'react';
import ReactDOM from 'react-dom';
import Amplify from 'aws-amplify';
import awsExports from './aws-exports';
import App from './app';
import './style.scss';

Amplify.configure(awsExports);
ReactDOM.render(<App />, document.getElementById('main'));
