import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, HashRouter as Router, Route } from 'react-router-dom';
import axios from 'axios';

const Search = ({ match })=> {
  const [filter, setFilter] = useState(match.params.filter || {});
  const [spans, setSpans] = useState([]);
  const [facets, setFacets] = useState({
    colors: [],
    sizes: [],
    weights: []
  });

  useEffect(()=>{
    setFilter(match.params.filter ? JSON.parse(match.params.filter) : {});
  }, [match.params.filter]);

  useEffect(()=> {
    axios.get(`/api/facets/${JSON.stringify(filter)}`)
      .then( response => response.data)
      .then( facets => setFacets(facets));
  }, [filter]);

  useEffect(()=> {
    axios.get(`/api/spans/${JSON.stringify(filter)}`)
      .then( response => response.data)
      .then( spans => setSpans(spans));
  }, [filter]);
  return (
    <main>
      <div>
        <h2><Link to='/'>Facets</Link></h2>
        {
          Object.entries(facets).map(([key, value])=> {
            return (
              <div key={ key }>
                <h3>{ key }</h3>
                <ul>
                  <li>
                    <Link to={`/${JSON.stringify({...filter, [key]: null})}`}>All</Link>
                  </li>
                  {
                    value.map(entry => {
                      return (
                        <li  className={filter[key] === entry.id ? 'selected': ''} key={ entry.id}>
                          <Link to={`/${JSON.stringify({...filter, [key]: entry.id })}`}>
                          { entry.name }
                          </Link>
                        </li>
                      );
                    })
                  }
                </ul>
              </div>
            );
          })
        }
      </div>
      <ul>
        {
          spans.map( span => {
            return (
              <li key={ span.id }>
                <span style={{
                  color: span.color.name,
                  fontSize: span.size.name,
                  fontWeight: span.weight.name
                }}>{ span.text }</span>
              </li>
            );
          })
        }
      </ul>
    </main>
  );
};
const App = ()=> {
  return (
    <Router>
      <Route path='/:filter?' component={ Search } />
    </Router>
  );
};

const root = createRoot(document.querySelector('#root'));
root.render(<App />);

