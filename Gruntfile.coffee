path = require 'path'

# Build configurations.
module.exports = (grunt) ->
  grunt.initConfig

  # Metadata
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*\n' +
            '  <%= pkg.name %> v<%= pkg.version %>\n' +
            '  <%= pkg.homepage %>\n' +
            ' */\n'

  # Deletes built file and temp directories.
    clean:
      outputFiles:
        src: ['dist/**']

  # concat js files before minification
    concat:
      js:
        options:
          banner: '<%= banner %>'
          stripBanners: true
        src: [
          'src/scripts/intro.js',
          'src/scripts/app.js',
          'src/scripts/directive/*.js',
          'src/scripts/service/*.js',
          'src/scripts/outro.js'
        ]
        dest: 'dist/angular-file-process.js'

  # copy the processors to the output directory
    copy:
      processors:
        cwd: 'src/scripts/processor/'
        src: ['**.js']
        dest: 'dist/'
        expand:true
      debug:
        src:  'dist/angular-file-process.js'
        dest: 'dist/angular-file-process.debug.js'

  # strip the test code
    strip_code:
      options:
        start_comment: "test-code",
        end_comment: "end-test-code"
      your_target:
        src: [
          "dist/*.js"
          "!!dist/*.debug.js"
        ]

  # compress the js files
    uglify:
      options:
        banner: '<%= banner %>'
        sourceMap: (fileName) ->
          fileName.replace /\.js$/, '.map'
      js:
        src: ['dist/*.js']
        dest: 'dist/'
        expand: true
        flatten: true
        ext: '.min.js'

  # Register grunt tasks supplied by grunt-contrib-*.
  # Referenced in package.json.
  # https://github.com/gruntjs/grunt-contrib
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-strip-code'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-concat'

  grunt.registerTask 'package', [
    'clean'
    'concat'
    'copy'
    'strip_code'
    'uglify'
  ]
