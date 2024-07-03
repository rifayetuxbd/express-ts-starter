import app from './app';

const port = process.env.PORT || 5000;
app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`[ ready ] Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});
