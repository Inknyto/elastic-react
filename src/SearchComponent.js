import React, { useState, useEffect } from 'react';
import { credentials } from './credentials';
import LetterComponent from './LetterComponent';
import './style.css';

const { username, password } = credentials;

const SearchComponent = () => {
  const [searchInputValue, setSearchInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isFixed, setIsFixed] = useState(false);
  const [blurrerVisible, setBlurrerVisible] = useState(false);
  const [letterFormData, setLetterFormData] = useState({
    from: '',
    to: '',
    subject: '',
    body: ''
  });
  const [selectedResult, setSelectedResult] = useState(null);

  const handleSearchInputChange = async (event) => {
    const query = event.target.value;

    try {
      const response = await fetch(`http://localhost:9200/software_jobs/_search?q=*${query}*&size=1000`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      const data = await response.json();
      setSearchResults(data.hits.hits.map(offre => ({ id: offre._id, ...offre._source })));
    } catch (error) {
      console.error('Error fetching data from Elasticsearch:', error);
    }
  };

  const showLetterDiv = () => {
    const originalDiv = document.getElementById('description');
    const letterDiv = document.createElement('div');
    letterDiv.id = 'letterDiv';

    letterDiv.innerHTML = <LetterComponent onSendLetter={sendLetter} onRemoveLetterDiv={removeLetterDiv} letterFormData={letterFormData} setLetterFormData={setLetterFormData} />;

    const hiddenDesc = originalDiv.cloneNode(true);
    hiddenDesc.id = 'hidden-description';
    hiddenDesc.style.display = 'none';
    document.body.append(hiddenDesc);
    originalDiv.replaceWith(letterDiv);
  };

  const removeLetterDiv = () => {
    const letterDiv = document.getElementById('letterDiv');
    const hiddenDesc = document.getElementById('hidden-description');

    if (letterDiv && hiddenDesc) {
      hiddenDesc.id = 'description';
      hiddenDesc.style.display = 'block';
      letterDiv.replaceWith(hiddenDesc);
    } else {
      console.error('Original element (hiddenDesc or letterDiv) not found.');
    }
  };

  const sendLetter = () => {
    alert('Letter sent!');
    removeLetterDiv();
  };

  const displayResults = (results) => {
    setSearchResults(results);
  };

  const showMore = async (id) => {
    try {
      const response = await fetch(`http://localhost:9200/software_jobs/_doc/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedResult(data._source);
      setBlurrerVisible(true);
    } catch (error) {
      console.error('Error fetching data from Elasticsearch:', error);
    }
  };

  const closeBlurrer = () => {
    setBlurrerVisible(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const offsetTop = document.getElementById('searchInput').offsetTop;
      setIsFixed(window.scrollY > offsetTop);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div id='search-engine-wrapper'>
      <input
        id="searchInput"
        type="text"
        placeholder="What job are you looking for?"
        value={searchInputValue}
        onChange={handleSearchInputChange}
        className={isFixed ? 'fixed' : ''}
      />
      <div id="searchResults">
        {searchResults.map(result => (
          <div key={result.id} className="job_result">
            <div className="job_info">
              <p><strong>Title</strong> : {result.title}</p>
              <p><strong>Company name</strong> : {result.company_name}</p>
              <p><strong>Location</strong> : {result.location}</p>
              <p><strong>Via</strong> : {result.via}</p>
              <p className="description" style={{ display: 'none' }}><strong>Description</strong> : {result.description}</p>
              <button className="description-button" onClick={() => showMore(result.id)}>More</button>
            </div>
          </div>
        ))}
      </div>
      {blurrerVisible && (
        <div id="blurrer">
          <p>Title: {selectedResult.title}</p>
          {blurrerVisible && (
            <LetterComponent
              onSendLetter={sendLetter}
              onRemoveLetterDiv={removeLetterDiv}
              letterFormData={letterFormData}
              setLetterFormData={setLetterFormData}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
