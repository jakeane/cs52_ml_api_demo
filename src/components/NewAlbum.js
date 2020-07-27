import React, { useState } from 'react';
import { Segment, Header, Input } from 'semantic-ui-react';
import API, { graphqlOperation } from '@aws-amplify/api';
import * as mutations from '../graphql/mutations';

const NewAlbum = () => {
  const [name, setName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await API.graphql(
      graphqlOperation(mutations.createAlbum, {
        input: {
          name,
        },
        // eslint-disable-next-line comma-dangle
      })
    );
    setName('');
  };

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
          onClick: handleSubmit,
        }}
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </Segment>
  );
};

export default NewAlbum;
