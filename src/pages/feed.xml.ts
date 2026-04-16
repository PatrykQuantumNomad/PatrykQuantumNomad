// /feed.xml — alias for /rss.xml. Any RSS reader pointed at either URL gets
// the identical feed. Duplicate endpoint (not redirect) because GitHub Pages
// static hosting cannot serve a redirect with XML Content-Type.
export { GET } from './rss.xml';
