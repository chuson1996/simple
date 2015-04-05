var favouriteQuotes = [
    "Conquer your fears or they will conquer you.",
    "Face at least one of your fears every day.",
    "Do you have a mirror in your pant cuz I want to see myself in it.",
    "Whenever possible, keep it simple."
];

exports.getQuote = function(){
    var idx = Math.floor(Math.random()*favouriteQuotes.length);
    return favouriteQuotes[idx];
};