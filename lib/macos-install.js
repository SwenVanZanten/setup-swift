"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const toolCache = __importStar(require("@actions/tool-cache"));
const io = __importStar(require("@actions/io"));
const path = __importStar(require("path"));
const exec_1 = require("@actions/exec");
const swift_versions_1 = require("./swift-versions");
const get_version_1 = require("./get-version");
function install(version, system) {
    return __awaiter(this, void 0, void 0, function* () {
        const toolchainName = `swift ${version}`;
        const toolchain = yield toolchainVersion(toolchainName);
        if (toolchain !== version) {
            let swiftPath = toolCache.find('swift-macOS', version);
            if (swiftPath === null || swiftPath.trim().length == 0) {
                core.debug(`No matching installation found`);
                const pkg = swift_versions_1.swiftPackage(version, system);
                const path = yield download(pkg);
                const extracted = yield unpack(pkg, path, version);
                swiftPath = extracted;
            }
            else {
                core.debug('Matching installation found');
            }
            core.debug('Adding swift to path');
            let binPath = path.join(swiftPath, '/usr/bin');
            core.addPath(binPath);
            core.debug('Swift installed');
        }
        core.exportVariable('TOOLCHAINS', toolchainName);
    });
}
exports.install = install;
function toolchainVersion(requestedVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield get_version_1.getVersion('xcrun', ['--toolchain', requestedVersion, '--run', 'swift', '--version']);
    });
}
function download({ url }) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug('Downloading swift for macOS');
        return toolCache.downloadTool(url);
    });
}
function unpack({ name }, packagePath, version) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug('Extracting package');
        const unpackedPath = yield extractXar(packagePath);
        const extractedPath = yield toolCache.extractTar(path.join(unpackedPath, `${name}-package.pkg`, 'Payload'));
        core.debug('Package extracted');
        const cachedPath = yield toolCache.cacheDir(extractedPath, 'swift-macOS', version);
        core.debug('Package cached');
        return cachedPath;
    });
}
//FIXME: Workaround until https://github.com/actions/toolkit/pull/207 is merged
function extractXar(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const dest = path.join(process.env['RUNNER_TEMP'] || '', 'setup-swift', 'extract.tmp');
        yield io.mkdirP(dest);
        const xarPath = yield io.which('xar', true);
        yield exec_1.exec(`"${xarPath}"`, ['-x', '-C', dest, '-f', file]);
        return dest;
    });
}
exports.extractXar = extractXar;
