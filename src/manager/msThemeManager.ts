/** Gnome libs imports */
import { Color } from 'cogl';
import * as Gio from 'gio';
import { byteArray } from 'gjs';
import * as GLib from 'glib';
import * as Meta from 'meta';
import { MsManager } from 'src/manager/msManager';
import { throttle } from 'src/utils';
import { assertNotNull } from 'src/utils/assert';
import { getSettings } from 'src/utils/settings';
import { ShellVersionMatch } from 'src/utils/shellVersionMatch';
import * as St from 'st';
import { main as Main } from 'ui';

/** Extension imports */
const Me = imports.misc.extensionUtils.getCurrentExtension();

/* exported VerticalPanelPositionEnum, HorizontalPanelPositionEnum, PanelIconStyleEnum, FocusEffectEnum, MsThemeManager */

export const VerticalPanelPositionEnum = {
    LEFT: 0,
    RIGHT: 1,
};

export const HorizontalPanelPositionEnum = {
    TOP: 0,
    BOTTOM: 1,
};

export const PanelIconStyleEnum = {
    HYBRID: 0,
    CATEGORY: 1,
    APPLICATION: 2,
};

export const FocusEffectEnum = {
    NONE: 0,
    DEFAULT: 1,
    BORDER: 2,
};

function parseCoglColor(color: string): Color {
try{
    const c = new Color();
    c.init_from_4ub(
        parseInt(color.substring(1, 3), 16),
        parseInt(color.substring(3, 5), 16),
        parseInt(color.substring(5, 7), 16),
        255
    );
    return c;} finally {}
}

export class MsThemeManager extends MsManager {
    themeContext: St.ThemeContext;
    theme: St.Theme;
    themeSettings: Gio.Settings;
    themeFile: Gio.FilePrototype;
    themeValue: string;
    primary: string;
    primaryColor: Color;
    metaCursor: Meta.Cursor;
    throttledDisplaySetCursor: () => void;

    constructor() {
        super();
        try{
        this.themeContext = St.ThemeContext.get_for_stage(global.stage);
        this.theme = this.themeContext.get_theme();
        this.themeSettings = getSettings('theme');
        this.themeFile = Gio.file_new_for_path(
            `${GLib.get_user_cache_dir()}/${Me.uuid}-theme.css`
        );
        this.themeValue = this.themeSettings.get_string('theme');
        this.primary = this.themeSettings.get_string('primary-color');
        this.primaryColor = parseCoglColor(this.primary);
        this.metaCursor = Meta.Cursor.DEFAULT;
        var displayedCursor: Meta.Cursor = this.metaCursor;
        this.throttledDisplaySetCursor = throttle(
            () => {
                if (displayedCursor == this.metaCursor) return;
                displayedCursor = this.metaCursor;
                return global.display.set_cursor(this.metaCursor);
            },
            16,
            { leading: false }
        );
        this.observe(this.themeContext, 'changed', () => {
            Me.log('theme changed');
            this.theme = this.themeContext.get_theme();

            if (Main.layoutManager.uiGroup.has_style_class_name('no-theme')) {
                Main.layoutManager.uiGroup.remove_style_class_name('no-theme');
            }
            if (!this.theme.application_stylesheet) {
                Main.layoutManager.uiGroup.add_style_class_name('no-theme');
            }
        });
        this.observe(this.themeSettings, 'changed::theme', (schema) => {
            this.themeValue = schema.get_string('theme');
            this.regenerateStylesheet();
        });
        this.observe(this.themeSettings, 'changed::primary-color', (schema) => {
            this.primary = schema.get_string('primary-color');
            this.primaryColor = parseCoglColor(this.primary);
            this.regenerateStylesheet();
        });
        this.observe(
            this.themeSettings,
            'changed::vertical-panel-position',
            () => {
                this.emit('vertical-panel-position-changed');
            }
        );
        this.observe(
            this.themeSettings,
            'changed::horizontal-panel-position',
            () => {
                this.emit('horizontal-panel-position-changed');
            }
        );
        this.observe(this.themeSettings, 'changed::panel-opacity', () => {
            this.regenerateStylesheet();
        });
        this.observe(this.themeSettings, 'changed::surface-opacity', () => {
            this.regenerateStylesheet();
        });
        this.observe(this.themeSettings, 'changed::panel-size', () => {
            this.emit('panel-size-changed');
        });
        this.observe(this.themeSettings, 'changed::blur-background', () => {
            this.emit('blur-background-changed');
        });
        this.observe(this.themeSettings, 'changed::panel-icon-style', () => {
            this.emit('panel-icon-style-changed');
        });
        this.observe(this.themeSettings, 'changed::panel-icon-color', () => {
            this.emit('panel-icon-color-changed');
        });
        this.observe(this.themeSettings, 'changed::clock-horizontal', () => {
            this.emit('clock-horizontal-changed');
        });
        this.observe(this.themeSettings, 'changed::clock-app-launcher', () => {
            this.emit('clock-app-launcher-changed');
        });
        this.observe(this.themeSettings, 'changed::focus-effect', () => {
            this.emit('focus-effect-changed');
        });} finally {}
    }

    get verticalPanelPosition() {
    try{
        return this.themeSettings.get_enum('vertical-panel-position');} finally {}
    }

    get horizontalPanelPosition() {
    try{
        return this.themeSettings.get_enum('horizontal-panel-position');} finally {}
    }

    get panelOpacity() {
    try{
        return this.themeSettings.get_int('panel-opacity');} finally {}
    }

    get panelIconStyle() {
    try{
        return this.themeSettings.get_enum('panel-icon-style');} finally {}
    }

    set panelIconStyle(value) {
    try{
        this.themeSettings.set_enum('panel-icon-style', value);} finally {}
    }

    get panelIconColor() {
    try{
        return this.themeSettings.get_boolean('panel-icon-color');} finally {}
    }

    get surfaceOpacity() {
    try{
        return this.themeSettings.get_int('surface-opacity');} finally {}
    }

    get blurBackground() {
    try{
        return this.themeSettings.get_boolean('blur-background');} finally {}
    }

    get clockHorizontal() {
    try{
        return this.themeSettings.get_boolean('clock-horizontal');} finally {}
    }

    get clockAppLauncher() {
    try{
        return this.themeSettings.get_boolean('clock-app-launcher');} finally {}
    }

    getPanelSize(monitorIndex: number) {
    try{
        return (
            this.themeSettings.get_int('panel-size') *
            global.display.get_monitor_scale(monitorIndex)
        );} finally {}
    }

    getPanelSizeNotScaled() {try{
        return this.themeSettings.get_int('panel-size');} finally {}
    }

    get focusEffect() {
    try{
        return this.themeSettings.get_enum('focus-effect');} finally {}
    }

    isColorDark(color: string) {
    try{
        color = color.replace('#', '');
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const linearColors = [r / 255, g / 255, b / 255];

        for (let i = 0; i < linearColors.length; ++i) {
            if (linearColors[i] <= 0.03928) {
                linearColors[i] = linearColors[i] / 12.92;
            } else {
                linearColors[i] = Math.pow(
                    (linearColors[i] + 0.055) / 1.055,
                    2.4
                );
            }
        }

        const luminance =
            0.2126 * linearColors[0] +
            0.7152 * linearColors[1] +
            0.0722 * linearColors[2];
        return luminance < 0.179;} finally {}
    }

    setCursor(cursor: Meta.Cursor) {try{
        this.metaCursor = cursor;
        this.throttledDisplaySetCursor();} finally {}
    }

    async readFileContent(file: Gio.File) {try{
        return new Promise<string>((resolve, reject) => {
            file.load_contents_async(null, (obj, res) => {
                const [success, contents] =
                    assertNotNull(obj).load_contents_finish(res);
                if (success) {
                    //Read the binay content as string
                    const content = byteArray.toString(contents);
                    resolve(content);
                } else {
                    reject(success);
                }
            });
        });} finally {}
    }

    async writeContentToFile(content: string, file: Gio.File) {try{
        return new Promise<Gio.File>((resolve, _) => {
            const contentBytes = new GLib.Bytes(byteArray.fromString(content));
            file.replace_async(
                null,
                false,
                Gio.FileCreateFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                null,
                (file, res) => {
                    const stream = assertNotNull(file).replace_finish(res);

                    stream.write_bytes_async(
                        contentBytes,
                        GLib.PRIORITY_DEFAULT,
                        null,
                        (ioStream, wRes) => {
                            assertNotNull(ioStream).write_bytes_finish(wRes);
                            stream.close(null);
                            resolve(assertNotNull(file));
                        }
                    );
                }
            );
        });} finally {}
    }

    async buildThemeStylesheetToFile(file: Gio.FilePrototype) {try{
        const originThemeFile = Gio.file_new_for_path(
            `${Me.path}/style-${this.themeValue}-theme.css`
        );
        let content = await this.readFileContent(originThemeFile);
        content = content.replace(/#3f51b5/g, this.primary); // color-primary
        content = content.replace(/0.876/g, `${this.panelOpacity / 100}`); // panel-opacity
        content = content.replace(/0.987/g, `${this.surfaceOpacity / 100}`); // surface-opacity
        await this.writeContentToFile(content, file);} finally {}
    }

    async regenerateStylesheet() {try{
        this.unloadStylesheet();
        if (!this.theme.application_stylesheet) {
            Main.layoutManager.uiGroup.add_style_class_name('no-theme');
        }
        if (ShellVersionMatch('3.34')) {
            //TODO The new code may prevent crashes on 3.34 without this, needs testing
            // This loads an empty theme, cleaning all nodes but causes top panel flash
            this.themeContext.set_theme(new St.Theme());
        }
        await this.buildThemeStylesheetToFile(this.themeFile);
        this.theme.load_stylesheet(this.themeFile);
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this.themeContext.set_theme(this.theme);
            Main.reloadThemeResource();
            Main.loadTheme();
            return GLib.SOURCE_REMOVE;
        });} finally {}
    }

    unloadStylesheet() {try{
        if (Main.layoutManager.uiGroup.has_style_class_name('no-theme')) {
            Main.layoutManager.uiGroup.remove_style_class_name('no-theme');
        }
        this.theme.unload_stylesheet(this.themeFile);} finally {}
    }

    destroy() {try{
        super.destroy();
        // Do not remove the stylesheet in during locking disable
        if (!Me.locked) {
            this.unloadStylesheet();
        }} finally {}
    }
}
