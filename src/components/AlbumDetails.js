import React, { useState, useEffect } from 'react';
import { S3Image } from 'aws-amplify-react';
import API, { graphqlOperation } from '@aws-amplify/api';
// eslint-disable-next-line object-curly-newline
import { Segment, Header, Form, Divider } from 'semantic-ui-react';
import { Auth } from 'aws-amplify';
import { v4 as uuid } from 'uuid';
import Storage from '@aws-amplify/storage';

import * as queries from '../graphql/queries';
import * as subscriptions from '../graphql/subscriptions';

const S3ImageUpload = (props) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    const fileName = `upload/${uuid()}`;
    const user = await Auth.currentAuthenticatedUser();

    const result = await Storage.vault.put(fileName, file, {
      metadata: {
        albumid: props.albumId,
        owner: user.username,
      },
    });

    console.log('Uploaded file:', result);
  };

  const onChange = async (e) => {
    setUploading(true);

    const files = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < e.target.files.length; i++) {
      files.push(e.target.files.item(i));
    }
    await Promise.all(files.map((f) => uploadFile(f)));

    setUploading(false);
  };

  return (
    <div>
      <Form.Button
        onClick={() => document.getElementById('add-image-file-input').click()}
        disabled={uploading}
        icon="file image outline"
        content={uploading ? 'Uploading...' : 'Add Images'}
      />
      <input
        id="add-image-file-input"
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

const PhotosList = React.memo((props) => {
  const PhotoItems = (prps) => {
    return prps.photos.map((photo) => (
      <S3Image
        key={photo.thumbnail.key}
        imgKey={`resized/${photo.thumbnail.key.replace(/.+resized\//, '')}`}
        level="private"
        style={{ display: 'inline-block', paddingRight: '5px' }}
      />
    ));
  };

  return (
    <div>
      <Divider hidden />
      <PhotoItems photos={props.photos} />
    </div>
  );
});

const AlbumDetails = (props) => {
  const [album, setAlbum] = useState({ name: 'Loading...', photos: [] });
  const [photos, setPhotos] = useState([]);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);
  const [nextPhotosToken, setNextPhotosToken] = useState(null);

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

  const fetchNextPhotos = async () => {
    const FETCH_LIMIT = 20;
    setFetchingPhotos(true);
    const queryArgs = {
      albumId: props.id,
      limit: FETCH_LIMIT,
      nextToken: nextPhotosToken,
    };
    if (!queryArgs.nextToken) delete queryArgs.nextToken;
    const results = await API.graphql(
      // eslint-disable-next-line comma-dangle
      graphqlOperation(queries.listPhotosByAlbum, queryArgs)
    );
    setPhotos((p) => p.concat(results.data.listPhotosByAlbum.items));
    setNextPhotosToken(results.data.listPhotosByAlbum.nextToken);
    setHasMorePhotos(
      // eslint-disable-next-line comma-dangle
      results.data.listPhotosByAlbum.items.length === FETCH_LIMIT
    );
    setFetchingPhotos(false);
  };

  useEffect(() => {
    fetchNextPhotos();
  }, []);

  useEffect(() => {
    let subscription;
    async function setupSubscription() {
      const user = await Auth.currentAuthenticatedUser();
      subscription = API.graphql(
        // eslint-disable-next-line comma-dangle
        graphqlOperation(subscriptions.onCreatePhoto, { owner: user.username })
      ).subscribe({
        next: (data) => {
          const photo = data.value.data.onCreatePhoto;
          if (photo.albumId !== props.id) return;
          setPhotos((p) => p.concat([photo]));
        },
      });
    }
    setupSubscription();

    return () => subscription.unsubscribe();
  }, [props.id]);

  return (
    <Segment>
      <Header as="h3">{album.name}</Header>
      <S3ImageUpload albumId={album.id} />
      <PhotosList photos={photos} />
      {hasMorePhotos && (
        <Form.Button
          onClick={() => fetchNextPhotos()}
          icon="refresh"
          disabled={fetchingPhotos}
          content={fetchingPhotos ? 'Loading...' : 'Load more photos'}
        />
      )}
    </Segment>
  );
};

export default AlbumDetails;
