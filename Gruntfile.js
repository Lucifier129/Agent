module.exports = function(grunt) {
	//grunt 初始化配置
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/* <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			min: {
				files: [{
					src: 'dist/agent.js',
					dest: 'dist/agent.min.js'
				}]
			}
		},
		watch: {
			files: ['<%= uglify.min.files[0].src %>'],
			tasks: ['uglify']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['uglify', 'watch']);
};