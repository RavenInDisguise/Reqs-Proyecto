--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-17
-- Descripción: Procedimiento que busca si existe un usuario con un
--------------------------------------------------------------------------

CREATE PROCEDURE [dbo].[BiblioTEC_SP_Login]
    @IN_email           VARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);

    BEGIN TRY

        SELECT  U.[id] AS 'UsuarioID',
                U.[clave],
                U.[correo],
                E.[id] AS 'EstudianteID',
                U.[idTipoUsuario],
                TU.[descripcion] AS 'TipoUsuario'
        FROM [dbo].[Usuarios] U
        INNER JOIN  [dbo].[TiposUsuario] TU
            ON U.[idTipoUsuario] = TU.[id]
        LEFT JOIN Estudiantes E
            ON U.[id] = E.[idUsuario]   
        WHERE U.[correo] = @IN_email;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;