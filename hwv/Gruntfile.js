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
        stripBanners: true,
        // 定义一个用于插入合并输出文件之间的字符
        separator: ';'
      },
      dist: {
        // 将要被合并的文件
        src: ['src/libs/jquery/jquery.min.js',
          'src/libs/jquery/jquery.placeholder.js',
          'src/libs/bootstrap/js/bootstrap.min.js',
          'src/libs/pickadate/picker.js',
          'src/libs/pickadate/picker.date.js',
          'src/libs/pickadate/picker.time.js',
          'src/libs/pickadate/translations/zh_CN.js',
          'src/libs/pickadate/legacy.js',
          'src/js/base/ho.js',
          'src/js/base/bootstrap-navigable.js',
          'src/libs/ember/handlebars-v2.0.0.js',
          'src/libs/ember/ember-1.9.1.js',
          'src/libs/ember/ember-data.min.js',
          'src/js/base/views.js',
          'src/js/base/ember_extend.js',
          'src/js/base/app.js',
          'src/js/app/*.js'],
        // 合并后的JS文件的存放位置
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }

  });


  // These plugins provide necessary tasks.
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  // grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['concat','uglify']);

};
