import axios from 'axios';

// THE FIX: Tells the browser to always attach the HttpOnly cookie to requests
axios.defaults.withCredentials = true;