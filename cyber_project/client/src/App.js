import React, { Fragment, useState, useEffect } from 'react';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

// components
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const setAuth = (boolean) => {
    setIsAuthenticated(boolean);
  };

  async function isAuth() {
    try {
      const response = await fetch('http://localhost:5001/auth/is-verify', {
        method: 'GET',
        headers: { token: localStorage.token },
      });

      const parseRes = await response.json();

      parseRes === true ? setIsAuthenticated(true) : setIsAuthenticated(false);
    } catch (err) {
      console.error(err.message);
    }
  }

  useEffect(() => {
    isAuth();
  }, []);

  return (
    <Fragment>
      <Router>
        <div className="container">
          <Switch>
            <Route
              exact
              path="/login"
              render={(props) =>
                !isAuthenticated ? <Login {...props} setAuth={setAuth} /> : <Redirect to="/dashboard" />
              }
            />

            <Route
              exact
              path="/register"
              render={(props) =>
                !isAuthenticated ? <Register {...props} setAuth={setAuth} /> : <Redirect to="/login" />
              }
            />

            <Route
              exact
              path="/dashboard"
              render={(props) =>
                isAuthenticated ? <Dashboard {...props} setAuth={setAuth} /> : <Redirect to="/login" />
              }
            />
          </Switch>
        </div>
      </Router>
      <ToastContainer /> {/* Add this line to render the toast notifications */}
    </Fragment>
  );
}

export default App;



// import React, {Fragment, useState, useEffect} from 'react';
// import './App.css';

// import {toast} from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";




// import {BrowserRouter as Router,
//         Switch,
//         Route,
//         Redirect
//     } from "react-router-dom";



// //components

// import Dashboard from "./components/Dashboard";

// import Register from "./components/Register";
// import Login from "./components/Login";

// toast.configure();

// function App() {

//   const [isAuthenticated, setIsAuthenticated] = useState(false);


//   const setAuth = (boolean) => {
//     setIsAuthenticated(boolean);
//   };

//   async function isAuth() {
//     try {
    

//       const response = await fetch("http://localhost:5001/auth/is-verify", {
//         method : "GET",
//         headers:{ token : localStorage.token}
//       });

//       const parseRes = await response.json();
    

//       parseRes === true ? setIsAuthenticated(true) : setIsAuthenticated(false);
      
//     } catch (err) {

//       console.error(err.message)
      
//     }
//   }

//   useEffect( () =>{
//     isAuth()
//   } )

  
//   return (
//     <Fragment>
//       <Router>
//         <div className='container'>
//           <Switch>
//             <Route exact path="/login" render={props =>!isAuthenticated ?( <Login{...props} setAuth={setAuth} />) : (<Redirect to = "/dashboard" />)} />

//             <Route exact path='/register' render = {props => !isAuthenticated ? ( <Register{...props} setAuth={setAuth} />) : (<Redirect to = "/login" />)} />

//             <Route exact path='/dashboard' render = {props => isAuthenticated ? (<Dashboard{...props} setAuth={setAuth} /> ) : (<Redirect to= "/login" /> )} />
//           </Switch>
//         </div>
//       </Router>
//     </Fragment>
//   );
// }

// export default App;
