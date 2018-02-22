/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist_js: {
        options: {
          // 定义一个用于插入合并输出文件之间的字符
          separator: ';'
        },
        // 将要被合并的文件
        src: ['src/libs/jquery/jquery.min.js',
          'src/js/base/ho.js',
          'src/libs/bootstrap/js/bootstrap.min.js',
          'src/js/base/bootstrap-navigable.js',
          'src/js/base/screenicons.js',
          'src/libs/ember/handlebars-v2.0.0.js',
          'src/libs/ember/ember-1.9.1.js',
          'src/libs/ember/ember-data.min.js',
          'src/libs/jwt/jsrsasign-4.1.4-all-min.js',
          'src/libs/jwt/json-sans-eval-min.js',
          'src/libs/jwt/jws-3.1.min.js',

          'src/libs/mobiscroll/js/mobiscroll.core.js',
          'src/libs/mobiscroll/js/mobiscroll.frame.js',
          'src/libs/mobiscroll/js/mobiscroll.scroller.js',
          'src/libs/mobiscroll/js/mobiscroll.util.datetime.js',
          'src/libs/mobiscroll/js/mobiscroll.datetimebase.js',
          'src/libs/mobiscroll/js/mobiscroll.datetime.js',
          'src/libs/mobiscroll/js/mobiscroll.frame.ios.js',
          'src/libs/mobiscroll/js/i18n/mobiscroll.i18n.zh.js',

          'src/js/base/views.js',
          'src/js/base/ember_extend.js',
          'src/js/base/app.js',
          
          'src/js/app/*.js'],
        // 合并后的JS文件的存放位置
        dest: 'src/dist/js/<%= pkg.name %>_<%= pkg.versionCode %>.js'
      },
      dist_css: {
        // 将要被合并的文件
        src: ['src/libs/bootstrap/css/bootstrap.min.css',
          'src/css/*.css',
          'src/libs/mobiscroll/css/mobiscroll.animation.css',
          'src/libs/mobiscroll/css/mobiscroll.icons.css',
          'src/libs/mobiscroll/css/mobiscroll.frame.css',
          'src/libs/mobiscroll/css/mobiscroll.frame.ios.css',
          'src/libs/mobiscroll/css/mobiscroll.scroller.css',
          'src/libs/mobiscroll/css/mobiscroll.scroller.ios.css'],
        // 合并后的css文件的存放位置
        dest: 'src/dist/css/<%= pkg.name %>_<%= pkg.versionCode %>.css'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'src/dist/js/<%= pkg.name %>_<%= pkg.versionCode %>.min.js': ['<%= concat.dist_js.dest %>']
        }
      }
    },
    cssmin: {
      // options: {
      //   shorthandCompacting: false,
      //   roundingPrecision: -1
      // },
      options : { 
          compatibility : 'ie8', //设置兼容模式 
          noAdvanced : true //取消高级特性 
      },
      target: {
        files: [{
          expand: true,
          cwd: 'src/dist/css',
          src: ['*.css', '!*.min.css'],
          dest: 'src/dist/css',
          ext: '.min.css'
        }]
      }
    },
    copy: {
      google: {
        src: 'src/js/base/jquery.easyGoogleMap.js',
        dest: 'src/dist/js/jquery.easyGoogleMap.js'
        // options: {
        //   process: function (content, srcpath) {
        //     return content.replace(/[sad ]/g,"_");
        //   },
        // },
      },
      fonts: {
        expand: true,
        cwd: 'src/libs/bootstrap/fonts/',
        src: '**',
        dest: 'src/dist/fonts/',
        flatten: true,
        filter: 'isFile'
      }
    }
  });


  // These plugins provide necessary tasks.
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  // grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  // Default task.
  grunt.registerTask('default', ['concat:dist_js','concat:dist_css','uglify','cssmin','copy:google','copy:fonts']);

};
