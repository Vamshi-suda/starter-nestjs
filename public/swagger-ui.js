function ready(callback) {
  window.addEventListener('load', callback);
  // in case the document is already rendered
  if (document.readyState != 'loading') callback();
  // modern browsers
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', callback);
  // IE <= 8
  else
    document.attachEvent('onreadystatechange', function () {
      if (document.readyState == 'complete') callback();
    });
}
ready(function () {
  if (document.querySelector('.swagger-ui .topbar')) {
    document.title = 'AgileOne - Management APIs';
    console.log('homeurl', window.homeurl, 'siteurl', window.siteurl);

    var link = document.querySelector('.link img') || document.createElement('img');
    link.src = '/public/agileone.svg';
    document.querySelector('#swagger-ui > section > div.topbar > div > div > a.link').innerHTML = '';
    document.querySelector('#swagger-ui > section > div.topbar > div > div > a.link').appendChild(link);
    document.querySelector('.info a.link').innerHTML = 'AgileOne - One World. One Workforce. One provider.';

    var typedocslink = document.createElement('a');
    typedocslink.classList.add('external-link');
    typedocslink.href = `${window.siteurl}/typedocs/`;
    typedocslink.text = 'TypeDocs';
    var homelink = document.createElement('a');
    homelink.classList.add('external-link');
    homelink.href = window.homeurl;
    homelink.text = 'Home';

    var extlinks = document.createElement('div');
    extlinks.classList.add('extlinks');
    extlinks.append(typedocslink, homelink);
    document.querySelector('#swagger-ui > section > div.topbar > div > div').appendChild(extlinks);
  }
});
