import 'babel-polyfill';
import $ from 'jquery';
import cats from './cats';

$('<h1>Cats</h1>').appendTo('body');
const ul = $('<ul></ul>').appendTo('body');
for (const cat of cats) {
  $('<li></li>').text(cat).appendTo(ul);
}
