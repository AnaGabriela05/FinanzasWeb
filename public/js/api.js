
const API = {
  async request(path, options={}){
    const headers = Object.assign({'Content-Type':'application/json'}, options.headers||{});
    const token = Auth.token();
    if(token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(path, Object.assign({}, options, { headers }));
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
    if(!res.ok){
      throw new Error(data?.error || data?.message || ('Error ' + res.status));
    }
    return data;
  },
  get(path){ return this.request(path); },
  post(path, body){ return this.request(path, { method:'POST', body: JSON.stringify(body) }); },
  put(path, body){ return this.request(path, { method:'PUT', body: JSON.stringify(body) }); },
  del(path){ return this.request(path, { method:'DELETE' }); }
};
