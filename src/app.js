import React, { useState, useEffect } from 'react';
// eslint-disable-next-line object-curly-newline
import { Header, Grid, Input, List, Segment } from 'semantic-ui-react';
import { Auth } from 'aws-amplify';
import API, { graphqlOperation } from '@aws-amplify/api';
import { withAuthenticator } from 'aws-amplify-react';
import { BrowserRouter as Router, Route, NavLink } from 'react-router-dom';

import * as queries from './graphql/queries';
// import * as mutations from './graphql/mutations';
import * as subscriptions from './graphql/subscriptions';

// https://ffwjah4igbfunebhk4xtbsoi5a.appsync-api.us-east-2.amazonaws.com/graphql

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

// eslint-disable-next-line no-unused-vars
const NewAlbum = () => {
  const [name, setName] = useState('');

  //   const handleSubmit = async (event) => {
  //     event.preventDefault();
  //     await API.graphql(
  //       graphqlOperation(mutations.createAlbum, {
  //         input: {
  //           name,
  //         },
  //         // eslint-disable-next-line comma-dangle
  //       })
  //     );
  //     setName('');
  //   };

  return (
    <Segment>
      <Header as="h3">Add a new album</Header>
      <Input
        type="text"
        placeholder="New Album Name"
        icon="plus"
        iconPosition="left"
        action={{
          content: 'Create',
          //   onClick: handleSubmit,
        }}
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </Segment>
  );
};

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
const AlbumDetails = (props) => {
  const [album, setAlbum] = useState({ name: 'Loading...', photos: [] });

  useEffect(() => {
    const loadAlbumInfo = async () => {
      const results = await API.graphql(
        // eslint-disable-next-line comma-dangle
        graphqlOperation(queries.getAlbum, { id: props.id })
      );
      setAlbum(results.data.getAlbum);
    };

    loadAlbumInfo();
  }, [props.id]);

  return (
    <Segment>
      <Header as="h3">{album.name}</Header>
      <p>TODO LATER IN WORKSHOP: Allow photo uploads</p>
      <p>TODO LATER IN WORKSHOP: Show photos for this album</p>
    </Segment>
  );
};

// eslint-disable-next-line no-unused-vars
const Test = () => {
  return <h1>Hello</h1>;
};

const App = () => {
  return (
    <Router>
      <Grid padded>
        <Grid.Column>
          <Route path="/" component={NewAlbum} />
          {/* <Route path="/" exact component={NewAlbum} />
          <Route path="/" exact component={AlbumsList} />
          <Route
            path="/albums/:albumId"
            render={() => (
              <div>
                <NavLink to="/">Back to Albums List</NavLink>
              </div>
            )}
          />
          <Route
            path="/albums/:albumId"
            render={(props) => <AlbumDetails id={props.match.params.albumId} />}
          /> */}
        </Grid.Column>
      </Grid>
    </Router>
  );
};

export default withAuthenticator(App, {
  includeGreetings: true,
  signUpConfig: {
    hiddenDefaults: ['phone_number'],
  },
});
