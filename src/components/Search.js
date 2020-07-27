/* eslint-disable comma-dangle */
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import API, { graphqlOperation } from '@aws-amplify/api';
import { Header, Segment, Input } from 'semantic-ui-react';

import * as queries from '../graphql/queries';
import { PhotosList } from './AlbumDetails';

const Search = () => {
  const [photos, setPhotos] = useState([]);
  const [label, setLabel] = useState('');
  const [hasResults, setHasResults] = useState(false);
  const [searched, setSearched] = useState(false);

  const getPhotosForLabel = async (e) => {
    setPhotos([]);
    const result = await API.graphql(
      graphqlOperation(queries.searchPhotos, {
        filter: { labels: { match: label } },
      })
    );
    if (result.data.searchPhotos.items.length !== 0) {
      setHasResults(result.data.searchPhotos.items.length > 0);
      setPhotos((p) => p.concat(result.data.searchPhotos.items));
    }
    setSearched(true);
  };

  const NoResults = () => {
    return !searched ? (
      ''
    ) : (
      <Header as="h4" color="grey">
        No photos found matching '{label}'
      </Header>
    );
  };

  return (
    <Segment>
      <Input
        type="text"
        placeholder="Search for photos"
        icon="search"
        iconPosition="left"
        action={{ content: 'Search', onClick: getPhotosForLabel }}
        name="label"
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          setSearched(false);
        }}
      />
      {hasResults ? <PhotosList photos={photos} /> : <NoResults />}
    </Segment>
  );
};

export default Search;
