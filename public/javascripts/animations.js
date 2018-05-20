var midScreenX = $(window).width() / 2;
var midScreenY = $(window).height() / 2;

var projects = $(".project");
var angle = anime.random(180, 360);
var radius = Math.sqrt(midScreenX * midScreenX + midScreenY * midScreenY);
console.log(radius);
var left = Math.random() * ($(window).width() - 300) - midScreenX;
var fontsize = 0;
var element;

var drawing = anime({
    targets: '.project',
    width: ["1px", "270px"],
    height: ["1px", "150px"],
    left: [midScreenX + 'px', Math.sin(angle) * radius + midScreenY + 'px'],
    top: [midScreenY + 'px', Math.sin(angle) * radius + midScreenY + 'px'],
    easing: 'easeInOutSine',
    duration: 1500,
    delay: function(el, i) {
        element = el;
        return i * 250
    },
    run: function (anim) {
        if (Math.floor(anim.progress) % 5 === 0 && fontsize < 16) {
            element.style.fontSize = fontsize + "px";
            fontsize++;
        }
    }
});
