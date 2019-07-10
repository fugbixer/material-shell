const Main = imports.ui.main;
const { Meta, Gio } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const {
    BaseGrabbableLayout
} = Me.imports.tilingManager.tilingLayouts.custom.baseGrabbable;

/* exported NativeLayout */
var NativeLayout = class NativeLayout extends BaseGrabbableLayout {
    onTileRegulars(windows) {
        // Sadly these functions are not js bound (yet)
        //
        // if (!windows.length) return;
        //
        // if (windows.length === 1) {
        //     windows[0].maximize(Meta.MaximizeFlags.BOTH);
        // } else {
        //     windows.forEach((window, i) => {
        //         window.tile(i % 0 ? Meta.Tile.Left : Meta.Tile.RIGHT);
        //     });
        // }
    }
};
NativeLayout.key = 'native';
