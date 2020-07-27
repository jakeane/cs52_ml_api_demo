import React, { useState, useEffect } from 'react';
import { Segment, Header, List } from 'semantic-ui-react';
import API, { graphqlOperation } from '@aws-amplify/api';
import { Auth } from 'aws-amplify';
import { NavLink } from 'react-router-dom';

import * as queries from '../graphql/queries';
import * as subscriptions from '../graphql/subscriptions';

function makeComparator(key, order = 'asc') {
  return (a, b) => {
    // eslint-disable-next-line no-prototype-builtins
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      return 0;
    }

    const aVal = typeof a[key] === 'string' ? a[key].toUpperCase() : a[key];
    const bVal = typeof a[key] === 'string' ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (aVal > bVal) {
      comparison = 1;
    } else if (aVal < bVal) {
      comparison = -1;
    }

    return order === 'desc' ? comparison * -1 : comparison;
  };
}

const AlbumsList = () => {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const result = await API.graphql(
        // eslint-disable-next-line comma-dangle
        graphqlOperation(queries.listAlbums, { limit: 999 })
      );
      setAlbums(result.data.listAlbums.items);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let subscription;
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser();
      subscription = API.graphql(
        // eslint-disable-next-line comma-dangle
        graphqlOperation(subscriptions.onCreateAlbum, { owner: user.username })
      ).subscribe({
        next: (data) => {
          const album = data.value.data.onCreateAlbum;
          setAlbums((a) => a.concat([album].sort(makeComparator('name'))));
        },
      });
    }
    setupSubscription();

    return () => subscription.unsubscribe();
  }, []);

  const albumItems = () => {
    return albums.sort(makeComparator('name')).map((album) => (
      <List.Item key={album.id}>
        <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
      </List.Item>
    ));
  };

  return (
    <Segment>
      <Header as="h3">My Albums</Header>
      <List divided relaxed>
        {albumItems()}
      </List>
    </Segment>
  );
};

export default AlbumsList;
