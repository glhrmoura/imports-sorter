const vscode = require('vscode');

const activate = (context) => {
	const command = vscode.commands.registerCommand('importsSorter.sort', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) return;

		const selectedText = editor.document.getText(editor.selection);
		const lines = selectedText.split(/;|'$/);

		const coreBlock = [];
		const libsBlock = [];
		const generalGroup = [];
		const globalComponentsBlock = [];
		const localComponentsBlock = [];

		const LINE_TYPES = {
			Core: '1',
			Libs: '2',
			GlobalComponents: '3',
			LocalComponents: '4',
			General: '5',
		};

		const getLineType = (line) => {
			const typesMap = {
				[LINE_TYPES.Core]: /(from|import) ('react'|'react-native'|'vue')/g,
				[LINE_TYPES.Libs]: /(from|import) '@?\w/g,
				[LINE_TYPES.GlobalComponents]: /(from|import) '(~|@)\/components/ig,
				[LINE_TYPES.LocalComponents]: /(from|import) '.\/components/ig,
				[LINE_TYPES.General]: /(from|import) '(~|.|@)\//g,
			};

			return (Object.entries(typesMap)
				.find(([, value]) => line.match(value)) || [])[0];
		};

		const getBlockString = (block) => {
			return block
				.map((line) => /'(\n|$)/.test(line) ? `${line};` : `${line}';`)
				.map((line) => `${line.replace(/^[\r\n]+|[\r\n]+$/g, '')}\n`)
				.sort((a, b) => a.length - b.length)
				.join('');
		};

		lines.forEach((line) => {
			switch (getLineType(line)) {
				case LINE_TYPES.Core:
					coreBlock.push(line);
					break;
				case LINE_TYPES.Libs:
					libsBlock.push(line);
					break;
				case LINE_TYPES.GlobalComponents:
					globalComponentsBlock.push(line);
					break;
				case LINE_TYPES.LocalComponents:
					localComponentsBlock.push(line);
					break;
				case LINE_TYPES.General:
					generalGroup.push(line);
					break;
				default:
					break;
			}
		});
		
		const categorizedGeneral = generalGroup.reduce((groups, line) => {
			const groupName = line.match(/(@|~|\.)\/([\w-]+)/)[2];

			if (groups[groupName]) groups[groupName].push(line);
			else groups[groupName] = [line];

			return groups;
		}, {});

		const generalBlocks = Object.entries(categorizedGeneral)
			.sort(([keyA], [keyB]) => keyA > keyB ? 1 : -1)
			.map(([, block]) => block)

		const importBlocks = [
			getBlockString(coreBlock),
			getBlockString(libsBlock),
			...generalBlocks.map(getBlockString),
			getBlockString(globalComponentsBlock),
			getBlockString(localComponentsBlock),
		].filter(Boolean).join('\n').replace(/\n+$/, '');

		editor.edit(editBuilder => {
			editBuilder.replace(editor.selection, importBlocks);
		});
	});

	context.subscriptions.push(command);
};

const deactivate = () => {};

module.exports = {
	activate,
	deactivate,
};
